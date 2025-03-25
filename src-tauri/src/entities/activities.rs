use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "activities")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub description: String,
    pub paid_by_id: Uuid,
    pub group_id: Uuid,
    pub time: DateTimeWithTimeZone,
    pub amount: Decimal,
    pub split_members: Vec<Uuid>,
    pub split_amounts: Vec<Decimal>,
    pub user_involvement: bool,
    pub expense_logo: Option<String>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::PaidById",
        to = "super::users::Column::Id"
    )]
    PaidBy,
    #[sea_orm(
        belongs_to = "super::groups::Entity",
        from = "Column::GroupId",
        to = "super::groups::Column::Id"
    )]
    Group,
    #[sea_orm(has_many = "super::transactions::Entity")]
    Transactions,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PaidBy.def()
    }
}

impl Related<super::groups::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Group.def()
    }
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transactions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
