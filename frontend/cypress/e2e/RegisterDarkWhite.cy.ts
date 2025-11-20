describe('Register write and darkmode test', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/register')


      cy.viewport(1920, 1080);

      cy.get('[formcontrolname="companyId"]')
      .type('4554')
      .should('have.value', '4554')

      cy.get('[formcontrolname="firstName"]')
      .type('Timora')
      .should('have.value', 'Timora')

      cy.get('[formcontrolname="lastName"]')
      .type('Test')
      .should('have.value', 'Test')

      cy.get('[formcontrolname="email"]')
      .type('timora.test@gmail.com')
      .should('have.value', 'timora.test@gmail.com')

      cy.get('[formcontrolname="address"]')
      .type('Michalovce 1058/5')
      .should('have.value', 'Michalovce 1058/5')

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


  })
})