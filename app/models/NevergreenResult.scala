package models

import play.api.libs.json._
import play.api.libs.functional.syntax._

case class NevergreenResult(
  testId: Int,
  testDefinitionPath: String,
  testDefinitionName: String,
  nrOfFailures: Int,
  link: String)

object NevergreenResult {
  val writes: Writes[NevergreenResult] = (
    (JsPath \ "id").write[Int] and
    (JsPath \ "definitionPath").write[String] and
    (JsPath \ "definitionName").write[String] and
    (JsPath \ "nrOfFailures").write[Int] and
    (JsPath \ "link").write[String])(unlift(NevergreenResult.unapply))
}