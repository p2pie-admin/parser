export default {
  id: "1145",
  name: "1-Online",
  display_name: "1-Online",
  admin_rating: 3.7,
  status: "active",
  rates_link: "https://1-online.ru/request-exportxml.xml",
  ref_link: "https://1-online.ru",
  exchanger_templates: [
    {
      include: "cash*_*\n*_cash*",
      exclude: "CASHRUB_BTC\nBTC_CASH*",
      cities: null,
      top_parameter: {
        code: "delivery",
        parameter: {
          en_description: "Personal meeting with the courier is possible",
          ru_description: "Возможна личная встреча с курьером",
          icon: {
            id: "603",
            alternativeText: null,
            name: "dilivery_20a1de6f5b.png",
            url: "/uploads/dilivery_20a1de6f5b_ffad4e58a9.png",
          },
        },
      },
    },
    {
      include: "*_*",
      exclude: "*rub_*\n*usd_*\n*_*rub\n*_*usd",
      cities: null,
      top_parameter: {
        code: "anon",
        parameter: {
          en_description: "Anonimous exchange",
          ru_description: "Анонимный обмен",
          icon: {
            id: "611",
            alternativeText: null,
            name: "metka_0004_Ellipse_7_d07c64d9e0.png",
            url: "/uploads/metka_0004_Ellipse_7_d07c64d9e0_7bf2ed2131.png",
          },
        },
      },
    },
  ],
  offices: [],
  logo: {
    alternativeText: null,
    url: "/uploads/1_online_2789b71a7e.jpg",
  },
};
