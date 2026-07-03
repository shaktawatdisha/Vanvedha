from django.db import transaction


@transaction.atomic
def confirm_batch(batch):
    if batch.status == 'CONFIRMED':
        raise ValueError('This batch has already been confirmed.')

    for usage in batch.raw_usages.select_related('raw_lot').select_for_update():
        lot = usage.raw_lot
        if lot.quantity_remaining_kg < usage.quantity_used_kg:
            raise ValueError(
                f'Lot {lot.barcode} only has {lot.quantity_remaining_kg}kg remaining '
                f'but {usage.quantity_used_kg}kg is required.'
            )
        lot.quantity_remaining_kg -= usage.quantity_used_kg
        lot.save(update_fields=['quantity_remaining_kg', 'updated_at'])

    variant = batch.output_variant.__class__.objects.select_for_update().get(pk=batch.output_variant.pk)
    variant.stock += batch.output_units
    variant.save(update_fields=['stock', 'updated_at'])

    batch.status = 'CONFIRMED'
    batch.save(update_fields=['status', 'updated_at'])
