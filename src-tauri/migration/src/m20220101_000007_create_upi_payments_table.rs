use sea_orm_migration::prelude::*;
use sea_query::Table;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(UpiPayments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UpiPayments::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(UpiPayments::TransactionId).uuid().not_null())
                    .col(ColumnDef::new(UpiPayments::UpiId).string().not_null())
                    .col(ColumnDef::new(UpiPayments::Status).string().not_null())
                    .col(
                        ColumnDef::new(UpiPayments::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UpiPayments::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UpiPayments::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum UpiPayments {
    Table,
    Id,
    TransactionId,
    UpiId,
    Status,
    CreatedAt,
    UpdatedAt,
}
