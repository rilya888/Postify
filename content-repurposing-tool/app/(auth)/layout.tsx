/**
 * Auth layout - login and signup pages
 * No extra wrapper, just passes children through
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
