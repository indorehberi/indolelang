// Reports the build id of whatever bundle is currently deployed. The installed
// PWA polls this and reloads itself when the id no longer matches the one baked
// into its own bundle — see ServiceWorkerRegister.
export async function GET() {
  return Response.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
