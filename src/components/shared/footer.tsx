export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NewsWave. All rights reserved.</p>
        <p className="text-sm">Stay informed, stay ahead.</p>
      </div>
    </footer>
  );
}