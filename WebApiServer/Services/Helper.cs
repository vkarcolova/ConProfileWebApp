public class CubicHermiteSpline
{
    private readonly double x0, x1, y0, y1, m0, m1, dx;

    public CubicHermiteSpline(double x0, double y0, double m0, double x1, double y1, double m1)
    {
        this.x0 = x0;
        this.y0 = y0;
        this.m0 = m0;
        this.x1 = x1;
        this.y1 = y1;
        this.m1 = m1;
        dx = x1 - x0;
    }

    public double Interpolate(double x)
    {
        double t = (x - x0) / dx;
        double t2 = t * t;
        double t3 = t2 * t;
        double h00 = 2 * t3 - 3 * t2 + 1;
        double h10 = t3 - 2 * t2 + t;
        double h01 = -2 * t3 + 3 * t2;
        double h11 = t3 - t2;
        return h00 * y0 + h10 * m0 * dx + h01 * y1 + h11 * m1 * dx;
    }
}
