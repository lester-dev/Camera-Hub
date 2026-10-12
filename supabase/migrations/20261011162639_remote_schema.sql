SET local check_function_bodies = off;

CREATE TABLE "public"."cart_items" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "product_id" uuid                     NOT NULL,
  "quantity"   integer                  NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "cart_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "cart_items_quantity_check" CHECK ((quantity > 0)),
  CONSTRAINT "cart_items_user_id_product_id_key" UNIQUE (user_id, product_id)
);

ALTER TABLE "public"."cart_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."order_items" (
  "id"           uuid          NOT NULL DEFAULT gen_random_uuid(),
  "order_id"     uuid          NOT NULL,
  "product_id"   uuid,
  "seller_id"    uuid,
  "product_name" text          NOT NULL,
  "unit_price"   numeric(12,2) NOT NULL,
  "quantity"     integer       NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_quantity_check" CHECK ((quantity > 0)),
  CONSTRAINT "order_items_unit_price_check" CHECK ((unit_price >= (0)::numeric))
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orders" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"          uuid,
  "total_amount"         numeric(12,2)            NOT NULL,
  "shipping_name"        text                     NOT NULL,
  "shipping_phone"       text                     NOT NULL,
  "shipping_address"     text                     NOT NULL,
  "shipping_city"        text                     NOT NULL,
  "shipping_province"    text                     NOT NULL,
  "shipping_postal_code" text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_total_amount_check" CHECK ((total_amount >= (0)::numeric))
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "seller_id"   uuid,
  "name"        text                     NOT NULL,
  "brand"       text                     NOT NULL,
  "category"    text                     NOT NULL,
  "subcategory" text                     NOT NULL,
  "description" text,
  "price"       numeric(12,2)            NOT NULL,
  "stock"       integer                  NOT NULL DEFAULT 0,
  "image_url"   text,
  "specs"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "products_brand_check" CHECK ((brand = ANY (ARRAY['Canon'::text, 'Nikon'::text, 'Sony'::text, 'Fujifilm'::text]))),
  CONSTRAINT "products_category_check" CHECK ((category = ANY (ARRAY['camera'::text, 'lens'::text]))),
  CONSTRAINT "products_category_subcategory_chk"
    CHECK
    ((((category = 'camera'::text) AND (subcategory = ANY (ARRAY['dslr'::text, 'mirrorless'::text, 'full-frame'::text]))) OR ((category = 'lens'::text) AND (subcategory = ANY
    (ARRAY['prime'::text, 'zoom'::text]))))),
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_price_check" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "products_stock_check" CHECK ((stock >= 0)),
  CONSTRAINT "products_subcategory_check" CHECK ((subcategory = ANY (ARRAY['dslr'::text, 'mirrorless'::text, 'full-frame'::text, 'prime'::text, 'zoom'::text])))
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"          uuid                     NOT NULL,
  "full_name"   text,
  "store_name"  text,
  "phone"       text,
  "address"     text,
  "city"        text,
  "province"    text,
  "postal_code" text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."order_status" AS ENUM (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

ALTER TABLE "public"."orders"
  ADD COLUMN "status" public.order_status NOT NULL DEFAULT 'pending'::public.order_status;

CREATE TYPE "public"."payment_method" AS ENUM (
  'gcash',
  'maya',
  'bank_transfer'
);

ALTER TABLE "public"."orders"
  ADD COLUMN "payment_method" public.payment_method NOT NULL;

CREATE TYPE "public"."user_role" AS ENUM (
  'customer',
  'seller'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.user_role NOT NULL DEFAULT 'customer'::public.user_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (id, role, full_name, store_name)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'seller'
         then 'seller'::public.user_role
         else 'customer'::public.user_role end,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'store_name'
  );
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.prevent_role_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Role cannot be changed after sign-up';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."cart_items"
  ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."order_items"
  ADD CONSTRAINT "order_items_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX cart_items_product_id_idx ON public.cart_items USING btree (product_id);

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);

CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);

CREATE INDEX order_items_seller_id_idx ON public.order_items USING btree (seller_id);

CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id);

CREATE INDEX products_brand_idx ON public.products USING btree (brand);

CREATE INDEX products_category_idx ON public.products USING btree (category, subcategory);

CREATE INDEX products_seller_id_idx ON public.products USING btree (seller_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users manage own cart - delete" ON "public"."cart_items"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage own cart - insert" ON "public"."cart_items"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage own cart - select" ON "public"."cart_items"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage own cart - update" ON "public"."cart_items"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Allow public insert on order_items" ON "public"."order_items"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (true);

CREATE POLICY "Allow public select on order_items" ON "public"."order_items"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Allow public insert on orders" ON "public"."orders"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (true);

CREATE POLICY "Allow public select on orders" ON "public"."orders"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Allow public update on orders" ON "public"."orders"
  FOR UPDATE
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Anyone can view active products" ON "public"."products"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_active = true));

CREATE POLICY "Sellers can delete own products" ON "public"."products"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = seller_id));

CREATE POLICY "Sellers can insert own products" ON "public"."products"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT auth.uid() AS uid) = seller_id) AND (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = 'seller'::public.user_role))))));

CREATE POLICY "Sellers can update own products" ON "public"."products"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = seller_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = seller_id));

CREATE POLICY "Sellers can view own products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = seller_id));

CREATE POLICY "Users can update own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "Users can view own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."prevent_role_change"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."prevent_role_change"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_role_change"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."prevent_role_change"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."cart_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cart_items" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."order_items" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."orders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

