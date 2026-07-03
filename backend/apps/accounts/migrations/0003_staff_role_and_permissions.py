import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_role_vendorprofile_deliveryagentprofile'),
    ]

    operations = [
        # 1. Extend the Role field choices to include STAFF
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('CUSTOMER', 'Customer'),
                    ('VENDOR',   'Vendor'),
                    ('DELIVERY', 'Delivery Agent'),
                    ('ADMIN',    'Admin'),
                    ('STAFF',    'Staff'),
                ],
                default='CUSTOMER',
                max_length=20,
            ),
        ),

        # 2. Named permission templates (the "tag")
        migrations.CreateModel(
            name='PermissionTemplate',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('updated_at',  models.DateTimeField(auto_now=True)),
                ('is_active',   models.BooleanField(default=True)),
                ('name',        models.CharField(max_length=100, unique=True)),
                ('description', models.CharField(blank=True, max_length=255)),
            ],
            options={'db_table': 'permission_templates'},
        ),

        # 3. CRUD rows per module inside each template
        migrations.CreateModel(
            name='TemplateModulePermission',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('module',     models.CharField(
                    max_length=30,
                    choices=[
                        ('orders_payments', 'Orders & Payments'),
                        ('accounts_users',  'Accounts & Users'),
                        ('catalog_reviews', 'Catalog & Reviews'),
                        ('procurement',     'Procurement & Processing'),
                    ],
                )),
                ('can_view',   models.BooleanField(default=False)),
                ('can_create', models.BooleanField(default=False)),
                ('can_edit',   models.BooleanField(default=False)),
                ('can_delete', models.BooleanField(default=False)),
                ('template',   models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='module_permissions',
                    to='accounts.permissiontemplate',
                )),
            ],
            options={
                'db_table':        'template_module_permissions',
                'unique_together': {('template', 'module')},
            },
        ),

        # 4. Per-staff profile: which template + optional per-staff overrides
        migrations.CreateModel(
            name='StaffProfile',
            fields=[
                ('id',                   models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at',           models.DateTimeField(auto_now_add=True)),
                ('updated_at',           models.DateTimeField(auto_now=True)),
                ('is_active',            models.BooleanField(default=True)),
                ('permission_overrides', models.JSONField(blank=True, default=dict)),
                ('user',     models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='staff_profile',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('template', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='staff_members',
                    to='accounts.permissiontemplate',
                )),
            ],
            options={'db_table': 'staff_profiles'},
        ),
    ]
