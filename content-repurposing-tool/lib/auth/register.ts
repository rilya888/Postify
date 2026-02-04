import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

/**
 * Register a new user
 * @param data - User registration data
 * @returns Created user (without password hash)
 * @throws Error if email already exists or validation fails
 */
export async function registerUser(data: RegisterInput) {
  // Validate input
  const validated = registerSchema.parse(data);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validated.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      passwordHash,
      name: validated.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return user;
}
