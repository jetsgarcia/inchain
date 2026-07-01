import { Component } from '@angular/core';
import { ApproverWorkspaceComponent } from '../approver-workspace/approver-workspace.component';

@Component({
  selector: 'app-approver-reviewed',
  imports: [ApproverWorkspaceComponent],
  template: `<app-approver-workspace mode="reviewed" />`,
})
export class ApproverReviewedComponent {}
