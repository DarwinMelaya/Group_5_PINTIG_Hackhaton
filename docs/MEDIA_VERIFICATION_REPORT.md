# DALUYAN enterprise media verification report

Research date: 2026-10-30

This report uses the supplied `daluyan_enterprises_15_with_photo_sources.json` as the enterprise inventory. Source pages were checked for identity and possible photo leads; a page being public, official, or linked from a directory does **not** establish permission to copy and republish its images.

## Summary

- Enterprises reviewed: 15
- Approved photographs: 0
- Approved photo files downloaded or uploaded to Supabase Storage: 0
- Enterprises awaiting owner/rights-holder authorization: 15
- Current UI behavior: authorized media is rendered only when a listing’s media item has `approved: true`, `rights_status: "authorized"`, and a safe HTTPS URL. Other records use the DALUYAN illustration fallback and retain source links for review.
- Storage/database readiness: migration `202610300003_enterprise_media.sql` creates the `enterprise_media` table, `enterprise-media` bucket, RLS policies, and Realtime publication entry. It must still be applied to the hosted Supabase project.

## Verification ledger

| Enterprise | Research sources | Licensing status | Result |
| --- | --- | --- | --- |
| Balar Hotel and Spa | [Province hotel list](https://marinduque.gov.ph/hotels-inns-and-homestays/), [Booking](https://www.booking.com/hotel/ph/balar-and-spa.html), [Expedia](https://www.expedia.com.ph/Boac-Hotels-Balar-Hotel-And-Spa.h39624412.Hotel-Information) | Permission required | Awaiting authorized owner-provided photo or written license |
| The Boac Hotel | [Province hotel list](https://marinduque.gov.ph/hotels-inns-and-homestays/), [business directory](https://www.bizippines.com/the-boac-hotel_1h-042-332-2065) | Unknown | Awaiting authorization |
| Hotel Marinduque | [Province hotel list](https://marinduque.gov.ph/hotels-inns-and-homestays/), [Marinduque Guide](https://www.marinduqueguide.com/places/hotel-marinduque) | Unknown | Awaiting authorization |
| Nine Balconies Island Stay | [Marinduque guide PDF](https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/), [directory](https://marinduquemarket.com/directory/b/8a040631-ac89-43e8-a307-4d56ad0dcad8) | Unknown | Awaiting authorization |
| Cafe Rajo | [Marinduque Guide explore](https://www.marinduqueguide.com/explore) | Unknown | Awaiting authorization |
| Guisian Cove Resort | [Marinduque guide PDF](https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/) | Unknown | Awaiting authorization |
| Family Beach Resort | [Marinduque guide PDF](https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/) | Unknown | Awaiting authorization |
| Luxor Resort | [Marinduque guide PDF](https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/) | Unknown | Awaiting authorization |
| Spencer’s Transient Inn | [Province hotel list](https://marinduque.gov.ph/hotels-inns-and-homestays/) | Permission required | Awaiting authorized owner-provided photo or written license |
| Rezidencia Faeldo Resort and Cafe | [Marinduque Guide explore](https://www.marinduqueguide.com/explore) | Unknown | Awaiting authorization |
| Rejano’s Bakery | [DTI/MSME PDF](https://msmehub.dti.gov.ph/wp-content/uploads/2025/02/Food-Beverages-1.pdf), [Facebook](https://www.facebook.com/RejanosArrowroot), [PNA photo page](https://www.pna.gov.ph/photos/61109), [NWPC feature](https://nwpc.dole.gov.ph/baking-through-the-crisis-how-uraro-bakery-survived-the-pandemic/), [MIMAROPA Ventures](https://www.mimaropaventures.ph/shop_details?id=24) | Permission required | Awaiting written permission from Rejano’s or each rights holder |
| Panuluyan Farmstay | [DOT-accredited tourism list](https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque) | Unknown | Awaiting authorization |
| Cavesera Residencia Farm and Resort | [Marinduque guide PDF](https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/) | Unknown | Awaiting authorization |
| Beach Club Cagpo | [DOT-accredited tourism list](https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque) | Unknown | Awaiting authorization |
| Villa Sunrise Inn | [Province hotel list](https://marinduque.gov.ph/hotels-inns-and-homestays/) | Permission required | Awaiting authorized owner-provided photo or written license |

## Supabase and follow-up

No image was uploaded to Supabase Storage because no source supplied a verified republish license or explicit owner permission. The media fields and upload helper are ready for a later authorized upload: store the approved object in `enterprise-media/{enterprise-id}/`, create its `enterprise_media` row, retain the original source URL, set `permission_status` and `approval_status` to their approved values, and record attribution/license text. The public app only renders approved rows whose Storage URL responds successfully. Until then, all 15 remain in `awaiting_authorized_photos`.
