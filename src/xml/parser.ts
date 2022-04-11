import axios, { AxiosResponse } from "axios";
import { Rate } from "src/types";
\
type DirRates = { [key: string]: Rate };

export default class Parser {
  constructor() {}

  _getXML = (link: string): any => {
    axios
      .get(link)
      .then(function (response) {
        // handle success
        console.log(response.data);
      })
      .catch(function (error: string) {
        // handle error
        console.log(error);
      })
      .then(function () {});
  };
}
