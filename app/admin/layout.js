// Le tableau de bord admin ne doit pas être indexé (en plus du robots.txt).
export const metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
