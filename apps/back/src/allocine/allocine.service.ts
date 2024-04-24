import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
const ALLOCINE_URL = 'https://www.allocine.fr/';

// await get(AllocineService).getRatings("Le Parrain")

@Injectable()
export class AllocineService {
  private axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({ baseURL: ALLOCINE_URL });
  }
  async getRatings(title: string) {
    const { data } = await this.axiosClient.get(`/rechercher/?q=${encodeURI(title)}`);

    const $ = cheerio.load(data);

    const movies = $('ul li.mdl')
      .map((_, element) => {
        const title = $(element).find('.meta-title-link').text();
        const spectatorRating = this.handleAllocineRating($(element).find('.rating-item .stareval-note').eq(1).text());
        const criticRating = this.handleAllocineRating($(element).find('.rating-item .stareval-note').eq(0).text());

        return { criticRating, title, spectatorRating };
      })
      .toArray();

    const res = movies.find((m) => m.title.toLowerCase() === title.toLowerCase());

    return { spectatorRating: res?.spectatorRating, criticRating: res?.criticRating };
  }

  handleAllocineRating(str: string) {
    const split = str.split(',');
    if (split.length !== 2) return undefined;

    const [whole, decimal] = split;

    return parseInt(whole) + 0.1 * parseInt(decimal);
  }
}
