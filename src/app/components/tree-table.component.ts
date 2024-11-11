import {ChangeDetectorRef, Component, inject, input, viewChildren} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PrimeIcons, PrimeTemplate} from 'primeng/api';
import {Button, ButtonDirective} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {ColorPickerModule} from 'primeng/colorpicker';
import {DropdownModule} from 'primeng/dropdown';
import {InputGroupModule} from 'primeng/inputgroup';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputSwitchModule} from 'primeng/inputswitch';
import {InputTextModule} from 'primeng/inputtext';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {SelectButtonModule} from 'primeng/selectbutton';
import {TableModule} from 'primeng/table';

import {Type} from '../enums/type';
import {Column} from '../models/column.model';
import {StringPipe} from '../pipes/string.pipe';
import {ColorPickerComponent} from './color-picker.component';
import {DatePickerComponent} from './date-picker.component';
import {IconTableHeaderComponent} from './icon-table-header.component';

@Component({
  selector: 'app-tree-table',
  standalone: true,
  imports: [
    Button,
    IconTableHeaderComponent,
    InputTextModule,
    PrimeTemplate,
    StringPipe,
    TableModule,
    FormsModule,
    DropdownModule,
    CheckboxModule,
    InputNumberModule,
    InputSwitchModule,
    InputGroupModule,
    ButtonDirective,
    SelectButtonModule,
    OverlayPanelModule,
    ColorPickerModule,
    ColorPickerComponent,
    DatePickerComponent,
  ],
  templateUrl: './tree-table.component.html',
  styleUrl: './tree-table.component.css',
})
export class TreeTableComponent {
  columns = input.required<Column[]>();
  isArray = input(false);

  changeDetectorRef = inject(ChangeDetectorRef);

  treeTableComponents = viewChildren(TreeTableComponent);

  protected expanded: Record<string, boolean> = {};
  protected types = Object.entries(Type).filter((entry) => entry[1] !== Type.Undefined);
  protected booleanOptions = [
    {label: 'False', value: false, icon: PrimeIcons.TIMES},
    {label: 'True', value: true, icon: PrimeIcons.CHECK},
  ];

  protected readonly PrimeIcons = PrimeIcons;
  protected readonly ColumnType = Type;

  fixName(column?: Column) {
    const columns = this.columns();
    if (this.isArray()) {
      columns.forEach((column, index) => {
        column.name = index.toString();
      });
    } else if (column) {
      const names = new Set();
      columns.forEach((otherColumn) => {
        if (column !== otherColumn) {
          names.add(otherColumn.name);
        }
      });
      while (names.has(column.name)) {
        column.name = `${column.name} (copy)`;
      }
    }
  }

  typeChanged(column: Column) {
    if (column.type === Type.Null) {
      column.value = null;
      column.columns = undefined;
      this.expanded[column.name] = false;
    } else if (column.type === Type.Number) {
      column.value = 0;
      column.columns = undefined;
      this.expanded[column.name] = false;
    } else if (column.type === Type.Boolean) {
      column.value = false;
      column.columns = undefined;
      this.expanded[column.name] = false;
    } else if (column.type === Type.String) {
      column.value = '';
      column.columns = undefined;
      this.expanded[column.name] = false;
    } else if (column.type === Type.Array) {
      column.value = [];
      column.columns = [];
    } else if (column.type === Type.Object) {
      column.value = {};
      column.columns = [];
    }
  }

  expandAll() {
    for (const column of this.columns()) {
      if (column.columns) {
        this.expanded[column.name] = true;
      }
    }

    this.changeDetectorRef.detectChanges();
    Promise.resolve().then(() =>
      this.treeTableComponents().forEach((treeTableComponent) => treeTableComponent.expandAll()),
    );
  }

  collapseAll() {
    this.expanded = {};

    this.treeTableComponents().forEach((treeTableComponent) => treeTableComponent.collapseAll());
  }

  add(index: number) {
    const column: Column = {name: '', type: Type.Null, value: null};
    this.columns().splice(index + 1, 0, column);
    this.fixName(column);
  }

  delete(index: number) {
    const columns = this.columns();
    delete this.expanded[columns[index].name];
    columns.splice(index, 1);
    this.fixName();
  }

  clone(index: number) {
    const columns = this.columns();
    const column: Column = JSON.parse(JSON.stringify(columns[index]));
    columns.splice(index + 1, 0, column);
    this.fixName(column);
  }
}
