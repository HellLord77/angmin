import {Routes} from '@angular/router';

import {AngminComponent} from './pages/angmin.component';
import {DatumComponent} from './pages/datum.component';
import {ItemComponent} from './pages/item.component';
import {ServerComponent} from './pages/server.component';

export const routes: Routes = [
  {path: '', component: AngminComponent},
  {path: ':server', component: ServerComponent},
  {path: ':server/:item', component: ItemComponent},
  {path: ':server/:item/:datum', component: DatumComponent},
  {path: '**', redirectTo: ''},
];
