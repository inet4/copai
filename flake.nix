{
  description = "COPAI packager";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    firefox-extensions = {
      url = "gitlab:rycee/nur-expressions?dir=pkgs/firefox-addons";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs =
    { nixpkgs, firefox-extensions, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ]; # todo use flake-utils
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f system);
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };
        in
        {
          default = pkgs.callPackage ./copai.nix {
            inherit (firefox-extensions.lib.${system}) buildFirefoxXpiAddon;
          };
        }
      );
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            nativeBuildInputs = [
              pkgs.web-ext
              pkgs.jq
            ];
          };
        }
      );

    };
}
