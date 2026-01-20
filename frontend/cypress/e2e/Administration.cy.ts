it('ADmin', function() {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
    cy.viewport(1920, 1080);
    
     cy.get('[formcontrolname="email"]')
      .type('testemaill.test@gmail.com')
      .should('have.value', 'testemaill.test@gmail.com')

      cy.get('[formcontrolname="password"]').first()
      .type('Timora1234!')
      .should('have.value', 'Timora1234!')
      cy.get('.grid > .w-full').click();

      cy.get('[routerlink="/calendar"]').click();

      cy.get(':nth-child(4) > [data-mat-col="2"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();
      cy.get(':nth-child(4) > [data-mat-col="6"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();
      cy.get('#mat-input-2').click();
      cy.get('#mat-input-2').type('Admin vacation Admin vacation Admin vacation');
      cy.get('.submit-btn > .mdc-button__label').click();

      cy.get(':nth-child(5) > [data-mat-col="2"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();
      cy.get(':nth-child(5) > [data-mat-col="6"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();
      cy.get('#mat-input-2').click();
      cy.get('#mat-input-2').type('Admin vacation 2 Admin vacation 2 Admin vacation 2');
      cy.get('.submit-btn > .mdc-button__label').click();

});

it('Admin', function() {
      cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
       cy.viewport(1920, 1080);
      cy.get('div.info div.role').click();
      cy.get('button.mat-mdc-button.mat-unthemed span.mdc-button__label').click();
      cy.get(':nth-child(4) > .actions > .approve').click();
      cy.get(':nth-child(5) > .actions > .deny').click();
});