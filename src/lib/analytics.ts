/**
 * Google Analytics 4 (Google tag), installed exactly as supplied by Google for this property:
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-73W4SD7YHF"></script>
 *   <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);}
 *           gtag('js', new Date()); gtag('config', 'G-73W4SD7YHF');</script>
 * It is rendered once, in the root shell immediately after <head>, so every page has exactly one tag.
 * Production builds only, so local development doesn't pollute the property.
 */
export const GA_MEASUREMENT_ID = "G-73W4SD7YHF";
export const GA_ENABLED = import.meta.env.PROD;
export const GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
export const GA_INLINE = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${GA_MEASUREMENT_ID}');`;
