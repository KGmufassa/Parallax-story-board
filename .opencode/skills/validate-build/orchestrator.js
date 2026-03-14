import testRunner from "./modules/testRunner.js"
import qaValidator from "./modules/qaValidator.js"

export default async function runValidation() {

  console.log("Starting validation pipeline")

  console.log("Step 9: Running test suite")
  await testRunner()

  console.log("Step 10: Running QA validation")
  await qaValidator()

  console.log("Validation pipeline complete")

}
