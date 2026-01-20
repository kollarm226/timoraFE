describe('Register and creating company registration with darkmode test , should be logged in like Employeer', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/register')

      cy.viewport(1920, 1080);

       cy.get('[formcontrolname="companyId"]')
      .type('1')
      .should('have.value', '1')

      cy.get('[formcontrolname="firstName"]')
      .type('Daniel')
      .should('have.value', 'Daniel')

      cy.get('[formcontrolname="lastName"]')
      .type('Dzvonik')
      .should('have.value', 'Dzvonik')

      cy.get('[formcontrolname="userName"]')
      .type('Dzvondulin')
      .should('have.value', 'Dzvondulin')

      cy.get('[formcontrolname="email"]')
      .type('daniel.dzvonik@kosickaakademia.sk')
      .should('have.value', 'daniel.dzvonik@kosickaakademia.sk')

      cy.get('[formcontrolname="password"]').first()
      .type('Timora1234!')
      .should('have.value', 'Timora1234!')
      
      cy.get('[formcontrolname="confirmPassword"]')
      .type('Timora1234!')
      .should('have.value', 'Timora1234!')
      
      cy.get('body > app-root > div > div > div > app-register > div > div > button > svg')
      .click()

      cy.get('button[aria-label="Toggle dark mode"]').click();
      cy.get('html').should('not.have.class', 'dark');

      cy.get('.grid > .w-full').click();

      cy.wait(10000);

      cy.get('[formcontrolname="email"]')
       .type('daniel.dzvonik@kosickaakademia.sk')
      .should('have.value', 'daniel.dzvonik@kosickaakademia.sk')

      cy.get('[formcontrolname="password"]')
      .type('Timora1234!')
      .should('have.value', 'Timora1234!')

      cy.get('.grid > .w-full').click();

      cy.get('.info > .role').should('contain', 'Employee');
  })
})