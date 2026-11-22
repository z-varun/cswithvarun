# frozen_string_literal: true

# Gives each post its own Open Graph / Twitter card image when one has been
# generated at assets/images/og/<slug>.png (see scripts/generate-og-images.mjs).
# A post's own `image:` front matter still wins; otherwise the site-wide default applies.
module OgImage
  class Generator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      default_image = site.config.dig("defaults")&.find { |d| d.dig("values", "image") }&.dig("values", "image")
      site.posts.docs.each do |post|
        relative = "assets/images/og/#{post.data['slug']}.png"
        next unless File.exist?(File.join(site.source, relative))
        next if post.data["image"] && post.data["image"] != default_image

        post.data["image"] = "/#{relative}"
      end
    end
  end
end
