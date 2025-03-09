use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "upi_payments")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub transaction_id: String,
    pub upi_id: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::transactions::Entity",
        from = "Column::TransactionId",
        to = "super::transactions::Column::Id"
    )]
    Transaction,
}

impl Related<super::transactions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transaction.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}