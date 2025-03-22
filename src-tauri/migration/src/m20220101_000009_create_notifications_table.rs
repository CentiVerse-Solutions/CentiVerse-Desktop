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
                    .table(Notifications::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Notifications::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Notifications::UserId).uuid().not_null())
                    .col(ColumnDef::new(Notifications::Type).string().not_null())
                    .col(ColumnDef::new(Notifications::Message).string().not_null())
                    .col(ColumnDef::new(Notifications::Read).boolean().not_null())
                    .col(
                        ColumnDef::new(Notifications::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Notifications::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Notifications::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Notifications {
    Table,
    Id,
    UserId,
    Type,
    Message,
    Read,
    CreatedAt,
    UpdatedAt,
}
