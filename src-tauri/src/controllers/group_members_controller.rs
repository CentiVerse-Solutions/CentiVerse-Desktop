use chrono::Utc;
use crate::entities::groups;
use crate::models::group_members::{AddGroupMemberReq, AddGroupMemberRes,RemoveGroupMemberReq};
use crate::entities::group_members::{self, ActiveModel};
use crate::custom_errors::app::AppError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode
};
use crate::request_verifier::{
    groups::{
        check_group_exists,
        check_user_exists_in_group,
        check_user_is_admin_in_group
    },
    group_members::check_group_member_exists_in_group 
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect, Set};
use uuid::Uuid;

pub async fn add_member_to_group(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<AddGroupMemberReq>,
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;
    check_group_exists(&db, payload.group_id).await?;
    check_user_exists_in_group(&db, payload.group_id, user_id).await?;

    let mut new_members = Vec::new();
    for member_id in payload.member_ids {
        if  !check_group_exists(&db,member_id).await.is_err() && 
            check_user_exists_in_group(&db, payload.group_id, member_id)
            .await
            .is_err()
        {
            new_members.push(group_members::ActiveModel {
                id: Set(Uuid::new_v4()),
                group_id: Set(payload.group_id),
                member_id: Set(member_id),
                joined_at: Set(Utc::now().into()),
            });
        }
    }

    let new_ids: Vec<Uuid> = new_members
        .iter()
        .map(|am| am.id.as_ref().clone())
        .collect();

    
    let _insert_result = group_members::Entity::insert_many(new_members)
        .on_empty_do_nothing()
        .exec(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    
    let inserted_models = group_members::Entity::find()
        .filter(group_members::Column::Id.is_in(new_ids))
        .all(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::OK, Json(AddGroupMemberRes::from(inserted_models))))
}


pub async fn remove_group_member(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<RemoveGroupMemberReq>,
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;
    
    check_group_exists(&db, payload.group_id).await?;
    
    let group = groups::Entity::find_by_id(payload.group_id)
        .one(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Group not found".into()))?;
    
    if group.creator_id != user_id {
        return Err(AppError::Unauthorized("Only group admin can remove members".into()));
    }

    // Check if the member being removed is the admin
    if payload.member_id == user_id {
        // Find the next oldest member to make admin
        let next_admin = group_members::Entity::find()
            .filter(group_members::Column::GroupId.eq(payload.group_id))
            .filter(group_members::Column::MemberId.ne(user_id))
            .order_by_asc(group_members::Column::JoinedAt)
            .one(&db)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        
        // If there's at least one other member, make them the admin
        if let Some(new_admin) = next_admin {
            let mut group_model: groups::ActiveModel = group.into();
            
            // println!("New admin assigned: {:?}", new_admin.member_id);
            
            group_model.creator_id = Set(new_admin.member_id);
            group_model.updated_at = Set(Utc::now().into());
            

            let _updated_group = group_model
                .update(&db)
                .await
                .map_err(|e| AppError::DatabaseError(e.to_string()))?;
            
            // Now remove the admin from the group members
            let res = group_members::Entity::delete_many()
                .filter(group_members::Column::GroupId.eq(payload.group_id))
                .filter(group_members::Column::MemberId.eq(user_id))
                .exec(&db)
                .await
                .map_err(|e| AppError::DatabaseError(e.to_string()))?;
            
            if res.rows_affected == 0 {
                return Err(AppError::NotFound("Member not found in group".into()));
            }
            
            return Ok((StatusCode::OK, Json("Admin privileges transferred and removed from group successfully")));
        } else {

            // ye uncomment tab karna agar group bhi delete karna hai for last member 
            // for last member delete group
            // let _delete_group = groups::Entity::delete_by_id(payload.group_id)
            // .exec(&db)
            // .await
            // .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        
        // Remove the last member
        let res = group_members::Entity::delete_many()
            .filter(group_members::Column::GroupId.eq(payload.group_id))
            .filter(group_members::Column::MemberId.eq(user_id))
            .exec(&db)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        
        return Ok((StatusCode::OK, Json("Last member has left group")));
            }
    } else {
        // If not admin, simply remove the member
        let res = group_members::Entity::delete_many()
            .filter(group_members::Column::GroupId.eq(payload.group_id))
            .filter(group_members::Column::MemberId.eq(payload.member_id))
            .exec(&db)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        
        if res.rows_affected == 0 {
            return Err(AppError::NotFound("Group member not found".into()));
        }
    }
    
    Ok((StatusCode::OK, Json("Removed from group successfully")))
}