from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_staff_role_and_permissions'),
    ]

    operations = [
        migrations.DeleteModel(
            name='VendorProfile',
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('CUSTOMER', 'Customer'),
                    ('DELIVERY', 'Delivery Agent'),
                    ('ADMIN',    'Admin'),
                    ('STAFF',    'Staff'),
                ],
                default='CUSTOMER',
                max_length=20,
            ),
        ),
    ]
