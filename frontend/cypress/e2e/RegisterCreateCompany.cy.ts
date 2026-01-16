describe('Register and creating company registration with darkmode test , should be logged in like Employeer', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/register')

      cy.viewport(1920, 1080);

      cy.get('.bg-gray-200').click();

      cy.get('.space-y-2 > :nth-child(2) > .w-full')
      .type('TestingCompanyy')
      .should('have.value', 'TestingCompanyy')

      cy.get('[formcontrolname="firstName"]')
      .type('TestNamee')
      .should('have.value', 'TestNamee')

      cy.get('[formcontrolname="lastName"]')
      .type('TestSurnamee')
      .should('have.value', 'TestSurnamee')

      cy.get('[formcontrolname="userName"]')
      .type('TestUserr')
      .should('have.value', 'TestUserr')

      cy.get('[formcontrolname="email"]')
      .type('testemaill.test@gmail.com')
      .should('have.value', 'testemaill.test@gmail.com')

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
       .type('testemaill.test@gmail.com')
      .should('have.value', 'testemaill.test@gmail.com')

      cy.get('[formcontrolname="password"]')
      .type('Timora1234!')
      .should('have.value', 'Timora1234!')

      cy.get('.grid > .w-full').click();

      cy.get('.info > .role').should('contain', 'Employer');
  })
})