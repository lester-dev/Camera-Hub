alter table public.profiles
  add column if not exists shipping_address text,
  add column if not exists city_province text;

alter table public.orders
  add column if not exists reference_number text,
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists contact_number text,
  add column if not exists city_province text,
  add column if not exists tracking_number text;

create or replace function public.checkout_cart(
  p_customer_name text,
  p_contact_number text,
  p_shipping_address text,
  p_city_province text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid := auth.uid();
  v_customer_email text := nullif(auth.jwt() ->> 'email', '');
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_product public.products%rowtype;
  v_total numeric := 0;
  v_payment_method public.orders.payment_method%type;
  v_order_id uuid;
  v_reference text;
  v_city text;
  v_province text;
begin
  if v_customer_id is null then
    raise exception 'A signed-in customer account is required to place an order.';
  end if;
  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_contact_number), '') = ''
     or coalesce(trim(p_shipping_address), '') = ''
     or coalesce(trim(p_city_province), '') = '' then
    raise exception 'Customer name, phone, shipping address, and city are required.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The order must contain at least one item.';
  end if;

  if lower(trim(p_payment_method)) = 'gcash' then
    v_payment_method := 'gcash';
  elsif lower(trim(p_payment_method)) = 'maya' then
    v_payment_method := 'maya';
  elsif lower(trim(p_payment_method)) = 'bank_transfer' then
    v_payment_method := 'bank_transfer';
  else
    raise exception 'Choose a valid payment method.';
  end if;

  v_city := trim(split_part(p_city_province, ',', 1));
  v_province := nullif(trim(substr(p_city_province, position(',' in p_city_province) + 1)), '');
  if v_province is null then
    v_province := v_city;
  end if;

  insert into public.profiles (
    id, full_name, phone, address, city, province, shipping_address, city_province, updated_at
  )
  values (
    v_customer_id, trim(p_customer_name), trim(p_contact_number),
    trim(p_shipping_address), v_city, v_province, trim(p_shipping_address),
    trim(p_city_province), now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    shipping_address = excluded.shipping_address,
    city_province = excluded.city_province,
    updated_at = excluded.updated_at;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity < 1 then
      raise exception 'Each order item must have a positive quantity.';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'A product in this cart is no longer available.';
    end if;
    if v_product.stock < v_quantity then
      raise exception 'Insufficient stock for "%". Only % units remain.', v_product.name, v_product.stock;
    end if;

    v_total := v_total + (v_product.price * v_quantity);
    update public.products
    set stock = stock - v_quantity
    where id = v_product_id;
  end loop;

  v_order_id := gen_random_uuid();
  v_reference := 'CH-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 12));

  insert into public.orders (
    id, reference_number, customer_id, customer_name, customer_email,
    contact_number, shipping_address, city_province, status, total_amount,
    payment_method, shipping_name, shipping_phone, shipping_city, shipping_province
  )
  values (
    v_order_id, v_reference, v_customer_id, trim(p_customer_name), v_customer_email,
    trim(p_contact_number), trim(p_shipping_address), trim(p_city_province),
    'processing', v_total, v_payment_method, trim(p_customer_name),
    trim(p_contact_number), v_city, v_province
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;

    select * into v_product from public.products where id = v_product_id;

    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, seller_id
    )
    values (
      v_order_id, v_product_id, v_product.name, v_quantity, v_product.price, v_product.seller_id
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'reference_number', v_reference,
    'total_amount', v_total,
    'payment_method', v_payment_method
  );
end;
$$;

create or replace function public.dispatch_order_v2(
  p_order_id uuid,
  p_tracking_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
begin
  if auth.uid() is null
     or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'seller' then
    raise exception 'A verified merchant account is required to dispatch orders.';
  end if;
  if coalesce(trim(p_tracking_number), '') = '' then
    raise exception 'A tracking number is required to dispatch an order.';
  end if;

  update public.orders
  set status = 'shipped',
      tracking_number = trim(p_tracking_number)
  where id = p_order_id
    and lower(status::text) not in ('shipped', 'delivered', 'completed')
  returning id into v_order_id;

  if v_order_id is null then
    raise exception 'The order was not found or has already been dispatched.';
  end if;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'status', 'shipped',
    'tracking_number', trim(p_tracking_number)
  );
end;
$$;

revoke all on function public.checkout_cart(text, text, text, text, text, jsonb) from public;
grant execute on function public.checkout_cart(text, text, text, text, text, jsonb) to authenticated;
revoke all on function public.dispatch_order_v2(uuid, text) from public;
grant execute on function public.dispatch_order_v2(uuid, text) to authenticated;

notify pgrst, 'reload schema';
