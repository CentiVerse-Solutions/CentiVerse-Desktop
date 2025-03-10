use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub payer_id: Uuid,
    pub receiver_id: Uuid,
    pub amount: Decimal,
    pub method: String,
    pub time: DateTimeWithTimeZone,
    pub status: String,
    pub group_id: Uuid,
    pub activity_id: Uuid,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::PayerId",
        to = "super::users::Column::Id"
    )]
    Payer,
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::ReceiverId",
        to = "super::users::Column::Id"
    )]
    Receiver,
    #[sea_orm(
        belongs_to = "super::groups::Entity",
        from = "Column::GroupId",
        to = "super::groups::Column::Id"
    )]
    Group,
    #[sea_orm(
        belongs_to = "super::activities::Entity",
        from = "Column::ActivityId",
        to = "super::activities::Column::Id"
    )]
    Activity,
    #[sea_orm(has_one = "super::upi_payments::Entity")]
    UpiPayments,
    #[sea_orm(has_one = "super::cash_transactions::Entity")]
    CashTransactions,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Payer.def()
    }
}

impl Related<super::groups::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Group.def()
    }
}

impl Related<super::activities::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Activity.def()
    }
}

impl Related<super::upi_payments::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UpiPayments.def()
    }
}

impl Related<super::cash_transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CashTransactions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
