package models

import play.api.libs.json._
import play.api.libs.functional.syntax._

case class BvtResult(
    name: String,
    build: String,
    passed: Int,
    failed: Int,
    notExecuted: Int,
    nodeId: String) {
}

object BvtResult {
  val writes: Writes[BvtResult] = (
      (JsPath \ "name").write[String] and
      (JsPath \ "build").write[String] and
      (JsPath \ "passed").write[Int] and
      (JsPath \ "failed").write[Int] and
      (JsPath \ "notExecuted").write[Int] and
      (JsPath \ "nodeId").write[String]
  )(unlift(BvtResult.unapply))
}