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
                    .table(Groups::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Groups::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Groups::CreatorId).uuid().not_null())
                    .col(ColumnDef::new(Groups::GroupName).string().not_null())
                    .col(ColumnDef::new(Groups::AutoLogo).string().null())
                    .col(
                        ColumnDef::new(Groups::TotalExpense)
                            .decimal()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Groups::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Groups::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Groups::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Groups {
    Table,
    Id,
    CreatorId,
    GroupName,
    AutoLogo,
    TotalExpense,
    CreatedAt,
    UpdatedAt,
}
