import bcryptjs from "bcryptjs";
import postgres from "postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      profile_pic TEXT
    );
  `;

  //   users
  //                                          Table "public.users"
  //    Column    |          Type          | Collation | Nullable |                 Default
  // -------------+------------------------+-----------+----------+-----------------------------------------
  //  user_id     | integer                |           | not null | nextval('users_user_id_seq1'::regclass)
  //  profile_pic | character varying(255) |           |          |
  //  email       | character varying(50)  |           |          |
  //  password    | character varying(64)  |           |          |
  //  name        | character varying(100) |           |          |
  // Indexes:
  //     "users_pkey" PRIMARY KEY, btree (user_id)
  //     "users_email_key" UNIQUE CONSTRAINT, btree (email)

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  //invoices
  //   Table "public.invoices"
  //   Column    |          Type          | Collation | Nullable |      Default
  // -------------+------------------------+-----------+----------+--------------------
  // id          | uuid                   |           | not null | uuid_generate_v4()
  // customer_id | uuid                   |           | not null |
  // amount      | integer                |           | not null |
  // status      | character varying(255) |           | not null |
  // date        | date                   |           | not null |
  // Indexes:
  //    "invoices_pkey" PRIMARY KEY, btree (id)

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`

        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  //   customers
  //                             Table "public.customers"
  //   Column   |          Type          | Collation | Nullable |      Default
  // -----------+------------------------+-----------+----------+--------------------
  //  id        | uuid                   |           | not null | uuid_generate_v4()
  //  name      | character varying(255) |           | not null |
  //  email     | character varying(255) |           | not null |
  //  image_url | character varying(255) |           | not null |
  // Indexes:
  //     "customers_pkey" PRIMARY KEY, btree (id)

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  //   revenue
  //                      Table "public.revenue"
  //  Column  |         Type         | Collation | Nullable | Default
  // ---------+----------------------+-----------+----------+---------
  //  month   | character varying(4) |           | not null |
  //  revenue | integer              |           | not null |
  // Indexes:
  //     "revenue_month_key" UNIQUE CONSTRAINT, btree (month)

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `
    )
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
