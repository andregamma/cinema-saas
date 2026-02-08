import { db } from ".";
import { userTable } from "./schema";

const adminUser = {
  name: "Admin User",
  email: "admin@cinema.com.br",
  password: await Bun.password.hash("admin123"),
}

const existingAdmin = await db.query.userTable.findFirst({
  where: (user, { eq }) => eq(user.email, adminUser.email),
});

if (!existingAdmin) {
  await db.insert(userTable).values(adminUser);
  console.log("Admin user created with email: " + adminUser.email);
} else {
  console.log("Admin user already exists with email: " + adminUser.email);
}