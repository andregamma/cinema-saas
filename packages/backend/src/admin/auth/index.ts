import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import { db } from "../../../database";
import z, { toJSONSchema } from "zod"
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { getConnInfo } from "hono/bun";
import { HTTPException } from "hono/http-exception";

const app = new Hono()

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

app.post(
  "/login",
  validator("json", authSchema),
  describeRoute({
    tags: ["Auth"],
    summary: "Login to the admin panel",
  }),
  async (c) => {
    const { email, password } = await c.req.json();
    const token = getCookie(c, "cine_auth_token");

    if (token) {
      return c.json({ message: "You are already logged in." }, 400);
    }

    const user = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });

    if (!user) {
      console.error("No user found with email: " + email);
      return c.json({ message: "Invalid email or password" }, 401);
    }

    const passwordMatch = await Bun.password.verify(password, user.password)

    if (!passwordMatch) {
      console.error("Password does not match for user: " + email);
      return c.json({ message: "Invalid email or password" }, 401);
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const connInfo = getConnInfo(c);

    console.info(`User ${email} authenticated successfully from IP: ${connInfo.remote.address}`);
    const jwt = await sign({
      sub: user.id,
      user: {
        name: user.name,
        email: user.email,
      },
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiration
      ip: connInfo.remote.address,
    }, jwtSecret)

    setCookie(c, "cine_auth_token", jwt, {
      httpOnly: true,
      secure: false,
    })

    return c.json({
      message: "Login successful",
    });
  }
)

app.post(
  "/logout",
  describeRoute({
    tags: ["Auth"],
    summary: "Logout from the admin panel",
  }),
  async (c) => {
    const token = getCookie(c, "cine_auth_token");

    if (!token) {
      return c.json({ message: "You are not logged in." }, 400);
    }

    deleteCookie(c, "cine_auth_token");

    return c.json({
      message: "Logout successful",
    });
  }
);

export { app as authRoutes }