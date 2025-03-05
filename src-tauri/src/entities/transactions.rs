use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "transactions")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: String,
    pub payer_id: String,
    pub receiver_id: String,
    pub amount: Option<Decimal>,
    pub method: Option<String>,
    pub time: Option<DateTime>,
    pub status: Option<String>,
    pub group_id: Option<String>,
    pub activity_id: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
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