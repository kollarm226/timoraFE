describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/about')


  
   cy.get(':nth-child(1) > h2').should('contain', 'Who We Are').should('be.visible')
   cy.get(':nth-child(1) > p').should('contain', 'We are a team of developers and enthusiasts for modern digital solutions who believe that vacation planning should not be stressful. Our goal is to bring a simple, secure and reliable way for employees to manage their time off, and for employers to efficiently track requests and plan capacities with a clear overview.').should('be.visible')
   cy.get(':nth-child(2) > h2').should('contain', 'Our Vision').should('be.visible')
   cy.get(':nth-child(2) > p').should('contain', 'We believe that organisations are successful when they truly listen to people – both those on the front line and those in the offices. That is why we created Timora Vacation Planner: to make communication between employees and managers easier and to simplify the entire vacation approval process.').should('be.visible')
   cy.get(':nth-child(3) > h2').should('contain', 'How We Work').should('be.visible')
   cy.get(':nth-child(3) > p').should('contain', 'We work in short development sprints and closely cooperate with our users. New features are tested in real use as soon as possible while keeping the whole system stable. A modern CI/CD pipeline and a strong focus on code quality are a natural part of our process.').should('be.visible')
   cy.get(':nth-child(4) > h2').should('contain', 'What We Value').should('be.visible')
   cy.get(':nth-child(2) > strong').should('contain', 'Simplicity').should('be.visible')
   cy.get('.mat-mdc-card > :nth-child(4) > :nth-child(2)').should('contain', ' an intuitive environment for everyone.').should('be.visible')
   cy.get(':nth-child(3) > strong').should('contain', 'Security').should('be.visible')
   cy.get('.mat-mdc-card > :nth-child(4) > :nth-child(3)').should('contain', 'reliable internal mechanisms and strong data protection.').should('be.visible')
   cy.get(':nth-child(4) > strong').should('contain', 'Collaboration').should('be.visible')
   cy.get(':nth-child(4) > :nth-child(4)').should('contain', 'ongoing dialogue with customers and end users.').should('be.visible')
   cy.get(':nth-child(5) > strong').should('contain', 'Growth').should('be.visible')
   cy.get(':nth-child(4) > :nth-child(5)').should('contain', 'continuous improvement and looking for new possibilities.').should('be.visible')
   
  })
})