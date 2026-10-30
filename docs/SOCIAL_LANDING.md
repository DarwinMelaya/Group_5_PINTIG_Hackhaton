# Daluyan social landing page

The landing page now uses an Instagram-inspired three-column layout: fixed gradient navigation, a central feed, and an informational rail. `src/social-theme.css` is loaded after the earlier design system to provide the current visual direction.

The four accent tokens are Ocean Breeze `#00C8D7`, Palm Green `#1E7A5A`, Sunset Coral `#FF6F61`, and Sand Beige `#E6D3B3`. Neutral white/off-white surfaces and dark green ink preserve legibility. White text sits on Palm Green controls; coral and cyan are decorative accents rather than backgrounds for small white text. The sidebar uses a dark rich-blue-to-pink gradient with white labels.

Town Stories use circular textile avatars with gradient rings. This is a horizontally scrollable row of real filter buttons, not fabricated ephemeral user content. Clicking a town selects its existing community posts; All towns resets the filter. Pressed state is exposed to assistive technology. Post controls retain existing reactions, comments, sharing and saves, including the existing sign-in requirements.

Original geometric placeholders live in `public/textile-1.svg` through `textile-3.svg`. Only fictional demo posts use them; real user media is preserved. Patterns are broadly textile-inspired and are not attributed to a specific cultural tradition.

The information rail moves below the feed on tablets, and the fixed navigation becomes the existing modal drawer on mobile. The Stories row scrolls inside its own container without widening the page. Motion continues to respect reduced-motion preferences.

Run `npm run build` and `npm run test:e2e` from `/workspace/DALUYAN-main/DALUYAN-main`. Browser coverage includes six town controls, actual town filtering, widths 320/390/768/1024/1440, overflow, focus restoration, reduced motion, and existing guest routes. Hosted Supabase operations are not validated by the guest-preview tests.
