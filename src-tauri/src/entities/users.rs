use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub username: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub password: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
#[sea_orm(table_name = "users")]

pub enum Relation {
    #[sea_orm(has_many = "super::friend_collections::Entity")]
    FriendCollections,
    #[sea_orm(has_many = "super::groups::Entity")]
    Groups,
    #[sea_orm(has_many = "super::group_members::Entity")]
    GroupMembers,
    #[sea_orm(has_many = "super::activities::Entity")]
    Activities,
    #[sea_orm(has_many = "super::transactions::Entity")]
    Transactions,
    #[sea_orm(has_many = "super::notifications::Entity")]
    Notifications,
}

impl Related<super::friend_collections::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::FriendCollections.def()
    }
}

impl Related<super::groups::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Groups.def()
    }
}

impl Related<super::group_members::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::GroupMembers.def()
    }
}

impl Related<super::activities::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Activities.def()
    }
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transactions.def()
    }
}

impl Related<super::notifications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Notifications.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
