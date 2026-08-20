revoke update on public.reviews from anon, authenticated;

grant update (theme, sentiment) on public.reviews to anon, authenticated;

create policy "Public can fill missing review analysis"
  on public.reviews for update
  to anon, authenticated
  using (theme is null and sentiment is null)
  with check (
    theme in (
      'Food Quality',
      'Service Speed',
      'Staff Friendliness',
      'Wait Time',
      'Atmosphere',
      'Cleanliness',
      'Value',
      'Parking',
      'Ordering / Delivery',
      'Other'
    )
    and sentiment in ('Positive', 'Neutral', 'Negative')
  );
