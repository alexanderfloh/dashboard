package util

import scala.xml.Source
import scala.xml.XML
import models.BvtResult

object BvtParser {
  def parse(nevergreens: String) = {
    val xml = XML.loadString(nevergreens)
    val rows = xml \ "data" \ "row"
    rows.map(row => row.child match {
      case Seq(name, build, passed, failed, notExecuted) => {
        BvtResult(
          name.text,
          //s"Build ${build.text}",
          build.text,
          passed.text.toInt,
          failed.text.toInt,
          notExecuted.text.toInt)
      }
    })
  }
}