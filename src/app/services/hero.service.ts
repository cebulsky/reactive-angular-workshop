import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

const DEFAULT_SEARCH = '';
const DEFAULT_LIMIT = LIMIT_HIGH;
export const DEFAULT_PAGE = 0;

export interface HeroRequestParams {
    apikey: string;
    offset: string;
    limit: string;
    nameStartsWith?: string;
}

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    private searchBS = new BehaviorSubject(DEFAULT_SEARCH);
    private limitBS = new BehaviorSubject(DEFAULT_LIMIT);
    private pageBS = new BehaviorSubject(DEFAULT_PAGE);

    search$ = this.searchBS.asObservable();
    limit$ = this.limitBS.asObservable();
    page$ = this.pageBS.asObservable();

    userPage$ = this.pageBS.pipe(map(page => page + 1));

    params$ = combineLatest([this.searchBS, this.limitBS, this.pageBS]).pipe(
        map(([searchTerm, limit, page]) => {
            const params: HeroRequestParams = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`, // page * limit
            };

            if (searchTerm.length) {
                params.nameStartsWith = searchTerm;
            }

            return params;
        }),
    );

    private heroesResponse$ = this.params$.pipe(
        debounceTime(1000),
        switchMap(_params =>
            this.http.get(HERO_API, {
                params: _params as any,
            }),
        ),
        shareReplay(1),
    );

    heroes$: Observable<Hero[]> = this.heroesResponse$.pipe(
        map((res: any) => res.data.results),
    );

    totalResults$ = this.heroesResponse$.pipe(
        map((res: any) => res.data.total),
    );

    totalPages$ = combineLatest([this.limitBS, this.totalResults$]).pipe(
        map(([limit, total]) => Math.ceil(total / limit)),
    );

    doSearch(searchTerm: string) {
        this.searchBS.next(searchTerm);
        this.pageBS.next(DEFAULT_PAGE);
    }

    movePageBy(moveBy: number) {
        const currentPage = this.pageBS.getValue();
        this.pageBS.next(currentPage + moveBy);
    }

    setLimit(limit: number) {
        this.limitBS.next(limit);
        this.pageBS.next(DEFAULT_PAGE);
    }

    constructor(private http: HttpClient) {}
}
