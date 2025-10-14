{ buildFirefoxXpiAddon, lib, ... }:

buildFirefoxXpiAddon rec {
  pname = "copai";
  version = "1.0.0";
  addonId = "copai@inet4.github.com";
  url = "https://github.com/inet4/copai/releases/download/v${version}/${pname}@inet4.github.com.xpi";
  sha256 = "sha256-fJdwNM1mLVeUuP17p7bkG2Hg2aHyr4OSR6kqfEK4bTk=";
  meta = with lib; {
    homepage = "https://github.com/inet4/copai";
    description = ":)";
    license = licenses.mit;
    platforms = platforms.all;
  };
}
