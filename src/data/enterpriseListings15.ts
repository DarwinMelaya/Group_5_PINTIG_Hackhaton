import type { Listing, Municipality } from "../lib/types";

type EnterpriseSeed = {
  name: string;
  municipality: Municipality;
  category: string;
  barangay: string;
  description: string;
  phones?: string[];
  email?: string;
  sourceUrl: string;
  photoSources?: string[];
};

const enterprises: EnterpriseSeed[] = [
  { name: "Balar Hotel and Spa", municipality: "Boac", category: "Hotels", barangay: "Balaring", description: "Hotel and spa in Balaring, Boac. Contact the enterprise for current rooms, spa services and rates.", phones: ["(042) 704-0194", "0917-882-2527"], email: "balarhotelandspa@gmail.com", sourceUrl: "https://marinduque.gov.ph/hotels-inns-and-homestays/", photoSources: ["https://www.booking.com/hotel/ph/balar-and-spa.html", "https://www.expedia.com.ph/Boac-Hotels-Balar-Hotel-And-Spa.h39624412.Hotel-Information"] },
  { name: "The Boac Hotel", municipality: "Boac", category: "Hotels", barangay: "San Miguel", description: "Accommodation in the center of Boac, convenient for visitors exploring the historic town.", phones: ["(042) 332-1121", "0939-922-8399"], email: "theboachotel@yahoo.com", sourceUrl: "https://marinduque.gov.ph/hotels-inns-and-homestays/", photoSources: ["https://www.bizippines.com/the-boac-hotel_1h-042-332-2065"] },
  { name: "Hotel Marinduque", municipality: "Boac", category: "Hotels", barangay: "Isok I", description: "Hotel accommodation in Isok I, Boac. Confirm availability and current services directly with the operator.", phones: ["0907-672-6768"], email: "ervel_7@yahoo.com", sourceUrl: "https://marinduque.gov.ph/hotels-inns-and-homestays/", photoSources: ["https://www.marinduqueguide.com/places/hotel-marinduque"] },
  { name: "Nine Balconies Island Stay", municipality: "Boac", category: "Hotels", barangay: "San Miguel", description: "Island stay in San Miguel, Boac, for visitors looking for a locally listed accommodation.", phones: ["0928-517-2593"], sourceUrl: "https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/", photoSources: ["https://marinduquemarket.com/directory/b/8a040631-ac89-43e8-a307-4d56ad0dcad8"] },
  { name: "Cafe Rajo", municipality: "Boac", category: "Restaurants", barangay: "Casa Narvas", description: "Local cafe listing near Del Mundo Street in Boac. Confirm operating hours and menu directly.", sourceUrl: "https://www.marinduqueguide.com/explore", photoSources: ["https://www.marinduqueguide.com/explore"] },
  { name: "Guisian Cove Resort", municipality: "Mogpog", category: "Resorts", barangay: "Guisian", description: "Resort listing in Guisian, Mogpog, for visitors seeking a coastal stay.", phones: ["0916-661-6045"], sourceUrl: "https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/", photoSources: ["https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/"] },
  { name: "Family Beach Resort", municipality: "Mogpog", category: "Resorts", barangay: "Nangka / Sitio Obog-Obog", description: "Beach resort listing in Nangka, Mogpog. Confirm access, facilities and rates directly.", phones: ["0943-472-7311"], sourceUrl: "https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/", photoSources: ["https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/"] },
  { name: "Luxor Resort", municipality: "Gasan", category: "Resorts", barangay: "Pangi", description: "Resort listing in Pangi, Gasan. Contact the operator for current amenities and availability.", phones: ["0942-332-0562"], email: "luxorresortmarinduque@gmail.com", sourceUrl: "https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/", photoSources: ["https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/"] },
  { name: "Spencer’s Transient Inn", municipality: "Gasan", category: "Homestays", barangay: "Bahi", description: "Transient inn in Bahi, Gasan. Confirm rooms, access and current contact details with the operator.", phones: ["(042) 704-0210", "0995-711-6492"], email: "alonaspencer@bigpond.com", sourceUrl: "https://marinduque.gov.ph/hotels-inns-and-homestays/", photoSources: ["https://marinduque.gov.ph/hotels-inns-and-homestays/"] },
  { name: "Rezidencia Faeldo Resort and Cafe", municipality: "Gasan", category: "Resorts", barangay: "Ilayang Pangi", description: "Resort and cafe listing in Ilayang Pangi, Gasan. Confirm current services directly.", sourceUrl: "https://www.marinduqueguide.com/explore", photoSources: ["https://www.marinduqueguide.com/explore"] },
  { name: "Rejano’s Bakery", municipality: "Santa Cruz", category: "Cultural products", barangay: "Banahaw", description: "Marinduque bakery and cultural-products enterprise offering arrowroot, peanut, cassava and other local products.", phones: ["(042) 705-4062"], email: "marinduquedeli@yahoo.com", sourceUrl: "https://msmehub.dti.gov.ph/wp-content/uploads/2025/02/Food-Beverages-1.pdf", photoSources: ["https://www.facebook.com/RejanosArrowroot", "https://www.pna.gov.ph/photos/61109", "https://nwpc.dole.gov.ph/baking-through-the-crisis-how-uraro-bakery-survived-the-pandemic/", "https://www.mimaropaventures.ph/shop_details?id=24"] },
  { name: "Panuluyan Farmstay", municipality: "Santa Cruz", category: "Cultural experiences", barangay: "Masalukot", description: "Farmstay and cultural experience listing in Masalukot, Santa Cruz. Confirm activities and access before visiting.", phones: ["0917-555-1088"], sourceUrl: "https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque", photoSources: ["https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque"] },
  { name: "Cavesera Residencia Farm and Resort", municipality: "Santa Cruz", category: "Resorts", barangay: "Ipil", description: "Farm and resort listing in Ipil, Santa Cruz. Contact the operator for current facilities and rates.", phones: ["0939-059-1447", "0917-630-7407"], sourceUrl: "https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/", photoSources: ["https://fliphtml5.com/vdpvw/xnmt/Welcome_to_Marinduque%21_-_The_Heart_of_the_Philippines/"] },
  { name: "Beach Club Cagpo", municipality: "Torrijos", category: "Resorts", barangay: "Cagpo", description: "Beach resort listing in Cagpo, Torrijos. Confirm current access, facilities and operating status.", phones: ["0921-993-2537"], sourceUrl: "https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque", photoSources: ["https://www.marinduqueguide.com/blog/dot-accredited-tourism-marinduque"] },
  { name: "Villa Sunrise Inn", municipality: "Torrijos", category: "Hotels", barangay: "759 Zamore Street", description: "Inn listing in Torrijos. Confirm current rooms, rates and availability directly with the operator.", phones: ["(042) 332-1882", "0917-673-1007"], email: "fermandmrio@gmail.com", sourceUrl: "https://marinduque.gov.ph/hotels-inns-and-homestays/", photoSources: ["https://marinduque.gov.ph/hotels-inns-and-homestays/"] },
];

function phoneLink(phone: string) {
  return "tel:" + phone.replace(/[ ()-]/g, "");
}

export const enterpriseListings15: Listing[] = enterprises.map((item, index) => ({
  id: `enterprise-source-${String(index + 1).padStart(2, "0")}`,
  owner_id: null,
  name: item.name,
  listing_type: "enterprise",
  municipality: item.municipality,
  description: item.description,
  latitude: null,
  longitude: null,
  fee_min: null,
  fee_max: null,
  fee_status: "unverified",
  fee_source_url: null,
  contact_links: {
    ...(item.phones?.[0] ? { phone: phoneLink(item.phones[0]) } : {}),
    ...(item.email ? { email: `mailto:${item.email}` } : {}),
  },
  accreditation_status: "Source review pending",
  source_url: item.sourceUrl,
  moderation_status: "published",
  created_at: "2026-10-30T00:00:00Z",
  metadata: {
    category: item.category,
    activities: [item.category.toLowerCase()],
    image: "/landscape-1.svg",
    source_label: "SOURCE REVIEW PENDING",
    last_checked: "2026-10-30",
    verified: false,
    public_promotion: true,
    community_benefit: 1,
    capacity: 0,
    baseline: 0,
    address: `${item.barangay}, ${item.municipality}, Marinduque`,
    media_status: "awaiting_authorized_photos",
    photo_source_urls: item.photoSources ?? [],
  },
}));
