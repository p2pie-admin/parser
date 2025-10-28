import { gql } from "graphql-request";
import callStrapi from "../gql/callStrapi";
import { getData } from "../utils/redis";
import { ISection } from "../types/selector";
import { _getCodes } from "./reload";
import { capitalize } from "../rates/Statistics/helper";

const mutation = (locale: string) => gql`
  mutation CreateArticle(
    $header: String
    $subheader: String
    $code: String
    $about: String
  ) {
    createArticle(
      data: {
        header: $header
        subheader: $subheader
        code: $code
        section: pm
        about: $about
      }
      locale: "${locale}"
    ) {
      data {
        id
      }
    }
  }
`;
export const createArticles = async (sections: ISection[]) => {
  for (const locale of ["en", "ru"]) {
    // Iterate through locales sequentially
    for (const section of sections) {
      // Iterate through sections sequentially
      await new Promise((r) => setTimeout(r, 1500)); // Delay before processing a section
      for (const pmg of section.pm_groups) {
        // Iterate through pm_groups sequentially
        const codes = _getCodes(pmg);
        for (const c of codes) {
          // Iterate through codes sequentially
          await new Promise((r) => setTimeout(r, 1500)); // Delay before processing a code
          const name = capitalize(
            pmg?.[`${locale as "en" | "ru"}_name`] || "-"
          );
          const code = c.toUpperCase();
          const data = {
            header: `${name} ${code}`,
            subheader: `All you need to know about ${name}`,
            code,
            section: "pm",
            about: `Description ${
              section[`${locale as "en" | "ru"}_title`]
            } ${name}`,
          };
          console.log("added " + code);
          await new Promise((r) => setTimeout(r, 1500)); // Delay before calling Strapi
          await callStrapi(mutation(locale), data); // Await the call to ensure it completes
        }
      }
      console.log(`Articles ${locale} created ${section.pm_groups.length}`);
    }
  }
};
