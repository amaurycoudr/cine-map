import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import * as dayjs from 'dayjs';
import * as qs from 'qs';

const ALLOCINE_URL = 'https://www.allocine.fr/';
const GOOGLE_URL = 'https://www.google.com/';

// await get(AllocineService).getRatings("Star Wars, épisode III - La Revanche des Sith")

@Injectable()
export class AllocineService {
  private allocineClient: AxiosInstance;
  private googleClient: AxiosInstance;

  constructor() {
    this.allocineClient = axios.create({ baseURL: ALLOCINE_URL });
    this.googleClient = axios.create({ baseURL: GOOGLE_URL, headers: { 'Accept-Encoding': 'text/html; charset=UTF-8' } });
  }

  async getRatings(title: string, releaseDate: string) {
    const link = await this.getFirstLinkFromGoogle(`allocine ${title} (${dayjs(releaseDate).year()})`, `${ALLOCINE_URL}film/fichefilm_gen_cfilm`);

    if (!link) {
      return { criticRating: undefined, spectatorRating: undefined, link };
    }

    const { data } = await this.allocineClient.get(link?.replace(ALLOCINE_URL, ''));
    const $ = cheerio.load(data);

    const spectatorRating = this.handleAllocineRating($('.rating-item-content:contains("Spectateurs") .stareval-note').text().trim());
    const criticRating = this.handleAllocineRating($('.rating-item-content:contains("Presse") .stareval-note').text().trim());

    return { criticRating, spectatorRating, link };
  }

  private async getFirstLinkFromGoogle(searchStr: string, linkCondition: string) {
    const { data } = await this.googleClient.get(`/search?q=${encodeURI(searchStr)}`);
    const $ = cheerio.load(data);

    const link = $('div#main')
      .find('a')
      .map((_, element) => {
        const link = $(element).attr('href');

        return link;
      })
      .toArray()
      .filter((link) => link?.includes(`/url?q=${linkCondition}`))
      .at(0);

    if (!link) return undefined;
    return qs.parse(link)['/url?q'] as string;
  }

  private handleAllocineRating(str: string) {
    const split = str.split(',');
    if (split.length !== 2) return undefined;

    const [whole, decimal] = split;

    return parseInt(whole) * 10 + parseInt(decimal);
  }

  static isTitle(title1: string, title2: string) {
    const regex = /(:)|(-)|(' ')/;
    const title1Treated = title1.toLowerCase().replace(regex, '').trim();
    const title2Treated = title2.toLowerCase().replace(regex, '').trim();

    return title1Treated === title2Treated;
  }
}
