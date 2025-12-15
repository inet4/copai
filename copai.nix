{ buildFirefoxXpiAddon, lib, ... }:

buildFirefoxXpiAddon rec {
  pname = "copai";
  version = "1.0.2";
  addonId = "copai@inet4.github.com";
  url = "https://github.com/inet4/copai/releases/download/v${version}/${pname}@inet4.github.com.xpi";
  sha256 = "sha256-qh0aYiZZohbknE0Y4cFEdv75ijrJZgAKdXyRReqw/Uo=";
  meta = with lib; {
    homepage = "https://github.com/inet4/copai";
    description = "funny cat images!";
    license = licenses.mit;
    platforms = platforms.all;
  };
}
