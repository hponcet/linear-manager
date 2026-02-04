module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-prettier/recommended",
    "stylelint-config-recommended-scss",
  ],
  rules: {
    "import-notation": "string",
    "color-hex-length": "long",
    "font-family-name-quotes": "always-unless-keyword",
    "at-rule-empty-line-before": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "export"],
      },
    ],
    "value-keyword-case": null,
    "no-descending-specificity": false,
    "keyframes-name-pattern": [
      "^[a-z][a-zA-Z0-9]+$",
      {
        resolveNestedSelectors: true,
        message: "Keyframe should be written in lowerKebabCase (selector-class-pattern)",
        // severity: "warning",
      },
    ],
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]+$",
      {
        resolveNestedSelectors: true,
        message: "Selector should be written in lowerKebabCase (selector-class-pattern)",
        severity: "warning",
      },
    ],
    "font-family-no-missing-generic-family-keyword": [
      true,
      {
        ignoreFontFamilies: ["Gilroy", "TungstenCondensed"],
        severity: "warning",
        message:
          'Possible font families are: Gilroy, TungstenCondensed.\nTo apply weight on the font, use font-weight instead of font-family naming. \n\ngood exemple: \nfont-family: "Gilroy";\nfont-weight: 700;\n\nbad exemple:\nfont-family: "Gilroy-Bold";',
      },
    ],
    "scss/at-extend-no-missing-placeholder": [true, { severity: "warning" }],
    "scss/no-global-function-names": [true, { severity: "warning" }],
    "no-descending-specificity": [true, { severity: "warning" }],
    "font-family-no-missing-generic-family-keyword": [
      true,
      {
        ignoreFontFamilies: ["Gilroy", "TungstenCondensed"],
        severity: "error",
        message:
          'Possible font families are: Gilroy, TungstenCondensed.\nTo apply weight on the font, use font-weight instead of font-family naming. \n\ngood exemple: \nfont-family: "Gilroy";\nfont-weight: 700;\n\nbad exemple:\nfont-family: "Gilroy-Bold";',
      },
    ],
    "keyframes-name-pattern": [
      "^[a-z][a-zA-Z0-9]+$",
      {
        resolveNestedSelectors: true,
        message: "Keyframe should be written in lowerKebabCase (selector-class-pattern)",
        severity: "error",
      },
    ],
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]+$",
      {
        resolveNestedSelectors: true,
        message: "Selector should be written in lowerKebabCase (selector-class-pattern)",
        severity: "error",
      },
    ],
  },
}
