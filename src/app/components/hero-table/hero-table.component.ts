import { Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeroService } from '../../services/hero.service';

@Component({
    selector: 'rx-hero-table',
    templateUrl: './hero-table.component.html',
    styleUrls: ['./hero-table.component.scss'],
})
export class HeroTableComponent {
    vm$ = combineLatest([
        this.hero.heroes$,
        this.hero.search$,
        this.hero.limit$,
        this.hero.totalResults$,
        this.hero.totalPages$,
        this.hero.userPage$,
    ]).pipe(
        map(
            ([
                heroes,
                searchTerm,
                limit,
                totalResults,
                totalPages,
                userPage,
            ]) => {
                return {
                    heroes,
                    searchTerm,
                    limit,
                    totalResults,
                    totalPages,
                    userPage,
                    disablePrev: userPage === 1,
                    disableNext: userPage === totalPages,
                };
            },
        ),
    );

    constructor(public hero: HeroService) {}

    doSearch(event: any) {
        this.hero.doSearch(event.target.value);
    }

    movePageBy(moveBy: number) {
        this.hero.movePageBy(moveBy);
    }

    setLimit(limit: number) {
        this.hero.setLimit(limit);
    }
}
