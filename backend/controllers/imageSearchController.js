import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Search Creative Commons / open-licensed images via Openverse (no API key).
 */
export async function searchInternetImages(req, res) {
  try {
    const q = String(req.query.q || 'category').trim() || 'category';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(24, Math.max(6, Number(req.query.pageSize) || 12));

    const url = new URL('https://api.openverse.org/v1/images/');
    url.searchParams.set('q', q);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    url.searchParams.set('license', 'cc0,pdm,by,by-sa');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return res.status(502).json({ message: 'Image search service unavailable' });
    }

    const data = await response.json();
    const results = (data.results || [])
      .filter((img) => img.url && img.thumbnail)
      .map((img) => ({
        id: img.id,
        url: img.url,
        thumbnail: img.thumbnail,
        title: img.title || q,
        creator: img.creator,
        source: img.source,
      }));

    res.json({
      query: q,
      page,
      pageCount: data.page_count || 1,
      results,
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ message: 'Failed to search images' });
  }
}

/** Copy a remote image into Cloudinary so it loads reliably on the storefront. */
export async function importImageFromUrl(req, res) {
  const rawUrl = String(req.body?.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    const result = await cloudinary.uploader.upload(rawUrl, {
      folder: 'ecommerce/categories',
      resource_type: 'image',
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Import image error:', error);
    res.status(502).json({ message: 'Could not import image. Try uploading a file instead.' });
  }
}
