describe('Login write and darkmode test', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/login')

      cy.get('[formcontrolname="companyId"]')
      .type('4554')
      .should('have.value', '4554')

      cy.get('[formcontrolname="username"]')
      .type('timora')
      .should('have.value', 'timora')

      cy.get('[formcontrolname="password"]').first()
      .type('Timora1234')
      .should('have.value', 'Timora1234')

      cy.get('.justify-between > :nth-child(1)')
      .click()

      cy.get('.justify-between > .underline')
      .should('be.visible')
      .and('not.be.disabled')

      cy.get('.justify-between > .underline')
      .should('be.visible')
      .and('not.be.disabled')

      cy.get('.transition-all')
      .should('be.visible')
      .and('not.be.disabled')

      cy.get('.gap-2')
      .should('be.visible')
      .and('not.be.disabled')

      cy.get('.mt-4 > .underline')
      .should('be.visible')
      .and('not.be.disabled')

      cy.get('.absolute')
      .click()
       cy.get('body').should('have.class', 'dark-theme');

       cy.get('button[aria-label="Toggle dark mode"]').click();
       cy.get('html').should('not.have.class', 'dark');
       

      









  })
})